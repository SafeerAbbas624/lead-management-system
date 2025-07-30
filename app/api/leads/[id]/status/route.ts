<<<<<<<
import { NextRequest, NextResponse } from 'next/server';



import { createClient } from '@supabase/supabase-js';







const supabase = createClient(



  process.env.NEXT_PUBLIC_SUPABASE_URL!,



  process.env.SUPABASE_SERVICE_ROLE_KEY!



);







export async function PATCH(



  request: NextRequest,



  { params }: { params: { id: string } }



) {



  try {



    const body = await request.json();



    const { leadstatus } = body;







    if (!leadstatus) {



      return NextResponse.json(



        { success: false, error: 'Lead status is required' },



        { status: 400 }



      );



    }







    const { data: lead, error } = await supabase



      .from('leads')



      .update({ 



        leadstatus,



        updatedat: new Date().toISOString()



      })



      .eq('id', params.id)



      .select()



      .single();







    if (error) {



      if (error.code === 'PGRST116') {



        return NextResponse.json(



          { success: false, error: 'Lead not found' },



          { status: 404 }



        );



      }



      throw error;



    }







    return NextResponse.json(lead);







  } catch (error) {



    console.error('Error updating lead status:', error);



    return NextResponse.json(



      {



        success: false,



        error: 'Failed to update lead status',



        details: error instanceof Error ? error.message : 'Unknown error',



      },



      { status: 500 }



    );



  }



}



=======
import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';



const supabase = createClient(

  process.env.NEXT_PUBLIC_SUPABASE_URL!,

  process.env.SUPABASE_SERVICE_ROLE_KEY!

);



export async function PATCH(

  request: NextRequest,

  { params }: { params: { id: string } }

) {

  try {

    const body = await request.json();

    const { leadstatus } = body;



    if (!leadstatus) {

      return NextResponse.json(

        { success: false, error: 'Lead status is required' },

        { status: 400 }

      );

    }



    const { data: lead, error } = await supabase

      .from('leads')

      .update({ 

        leadstatus,

        updatedat: new Date().toISOString()

      })

      .eq('id', params.id)

      .select()

      .single();



    if (error) {

      if (error.code === 'PGRST116') {

        return NextResponse.json(

          { success: false, error: 'Lead not found' },

          { status: 404 }

        );

      }

      throw error;

    }



    return NextResponse.json(lead);



  } catch (error) {

    console.error('Error updating lead status:', error);

    return NextResponse.json(

      {

        success: false,

        error: 'Failed to update lead status',

        details: error instanceof Error ? error.message : 'Unknown error',

      },

      { status: 500 }

    );

  }

}

>>>>>>>
